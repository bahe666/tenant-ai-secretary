-- ===== 9 张业务表 =====

-- 表1: 会话表
CREATE TABLE assistant_session (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表2: 消息表
CREATE TABLE assistant_message (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES assistant_session(session_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表3: 巡检提醒表
CREATE TABLE assistant_alert (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'resource_expiry', 'usage_anomaly', 'cost_spike', 'quota_warning'
  )),
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  summary TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'dismissed')),
  notified_channels JSONB DEFAULT '[]',
  dedupe_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表4: 成本报告表
CREATE TABLE assistant_report (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_type VARCHAR(20) DEFAULT 'monthly' CHECK (report_type IN ('monthly', 'weekly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}',
  top_costs JSONB NOT NULL DEFAULT '[]',
  anomalies JSONB DEFAULT '[]',
  idle_resources JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  expiring_resources JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表5: 续租方案表
CREATE TABLE assistant_renewal (
  renewal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected',
    'expired', 'executing', 'completed', 'failed'
  )),
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by VARCHAR(100),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表6: 审计日志表
CREATE TABLE assistant_audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  agent_instance_id VARCHAR(100),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'query', 'alert_generate', 'report_generate',
    'renewal_create', 'renewal_approve', 'renewal_reject', 'renewal_execute',
    'config_change', 'permission_change', 'kill_switch'
  )),
  resource_ids JSONB DEFAULT '[]',
  request_detail JSONB DEFAULT '{}',
  response_detail JSONB DEFAULT '{}',
  approval_info JSONB,
  result VARCHAR(20) CHECK (result IN ('success', 'failure', 'partial_success')),
  is_anomaly BOOLEAN DEFAULT FALSE,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表7: 秘书配置表
CREATE TABLE assistant_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id),
  enabled_features JSONB DEFAULT '["qa", "patrol", "cost_insight", "renewal"]',
  template_id VARCHAR(50) DEFAULT 'full',
  resource_scope JSONB DEFAULT '{"type": "all"}',
  amount_limit_per_action DECIMAL(12,2) DEFAULT 50000.00,
  amount_limit_per_month DECIMAL(12,2) DEFAULT 200000.00,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表8: 权限规则表
CREATE TABLE assistant_permission_rule (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_name VARCHAR(50) NOT NULL,
  allowed_features JSONB NOT NULL,
  resource_constraints JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, role_name)
);

-- 表9: 提醒偏好表
CREATE TABLE assistant_alert_preference (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  enabled_alert_types JSONB DEFAULT '["resource_expiry","usage_anomaly","cost_spike","quota_warning"]',
  channels JSONB DEFAULT '{"in_app": true, "sms": false, "email": false}',
  frequency VARCHAR(20) DEFAULT 'daily_digest' CHECK (frequency IN ('realtime', 'daily_digest', 'weekly_digest')),
  quiet_hours JSONB DEFAULT '{"start": "22:00", "end": "08:00"}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 业务表索引
CREATE INDEX idx_session_tenant_user ON assistant_session(tenant_id, user_id);
CREATE INDEX idx_message_session ON assistant_message(session_id);
CREATE INDEX idx_message_tenant ON assistant_message(tenant_id);
CREATE INDEX idx_alert_tenant_status ON assistant_alert(tenant_id, status);
CREATE INDEX idx_alert_dedupe ON assistant_alert(dedupe_key);
CREATE INDEX idx_report_tenant_period ON assistant_report(tenant_id, period_start);
CREATE INDEX idx_renewal_tenant_status ON assistant_renewal(tenant_id, status);
CREATE INDEX idx_renewal_expired ON assistant_renewal(expired_at) WHERE status = 'pending_approval';
CREATE INDEX idx_audit_tenant_time ON assistant_audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_action ON assistant_audit_log(action_type);
CREATE INDEX idx_audit_anomaly ON assistant_audit_log(is_anomaly) WHERE is_anomaly = TRUE;

-- 启用 RLS
ALTER TABLE assistant_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_renewal ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_permission_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_alert_preference ENABLE ROW LEVEL SECURITY;
