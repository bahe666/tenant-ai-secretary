-- ===== Mock 基础数据表 =====
-- 这些表模拟真实云平台的数据

-- 租户表
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户表（与 Supabase auth.users 关联）
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 资源表（模拟云资源）
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  spec VARCHAR(255),
  region VARCHAR(50) DEFAULT '上海一区',
  status VARCHAR(20) DEFAULT 'running',
  billing_type VARCHAR(20) DEFAULT 'prepaid',
  tags JSONB DEFAULT '{}',
  resource_group VARCHAR(100),
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 账单记录表
CREATE TABLE billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID REFERENCES resources(id),
  date DATE NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 使用率指标表
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID NOT NULL REFERENCES resources(id),
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(8,2) NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 配额表
CREATE TABLE quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  quota_type VARCHAR(100) NOT NULL,
  quota_limit INT NOT NULL,
  quota_used INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知识文档表（简单实现，非向量搜索）
CREATE TABLE knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_resources_tenant ON resources(tenant_id);
CREATE INDEX idx_resources_expire ON resources(tenant_id, expire_at);
CREATE INDEX idx_billing_tenant_date ON billing_records(tenant_id, date);
CREATE INDEX idx_usage_metrics_resource ON usage_metrics(resource_id, sampled_at);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 启用 RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;
