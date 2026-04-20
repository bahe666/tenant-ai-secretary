-- ===== RLS 策略 =====

-- 创建 private schema 用于安全函数
CREATE SCHEMA IF NOT EXISTS private;

-- 辅助函数：从 JWT 中提取 tenant_id
CREATE OR REPLACE FUNCTION private.get_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID);
END;
$$;

-- 辅助函数：获取当前用户角色
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT (auth.jwt() -> 'app_metadata' ->> 'role'));
END;
$$;

-- ===== Mock 表 RLS =====

CREATE POLICY "tenant_isolation" ON tenants
  FOR SELECT TO authenticated
  USING (id = (SELECT private.get_tenant_id()));

CREATE POLICY "users_tenant_read" ON users
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "resources_tenant_read" ON resources
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "resources_tenant_update" ON resources
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()))
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "billing_tenant_read" ON billing_records
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "usage_tenant_read" ON usage_metrics
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "quotas_tenant_read" ON quotas
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

-- knowledge_docs 对所有认证用户可读（公共知识库）
CREATE POLICY "docs_read_all" ON knowledge_docs
  FOR SELECT TO authenticated
  USING (true);

-- ===== 业务表 RLS =====

-- assistant_session
CREATE POLICY "session_select" ON assistant_session
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "session_insert" ON assistant_session
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "session_update" ON assistant_session
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()))
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_message
CREATE POLICY "message_select" ON assistant_message
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "message_insert" ON assistant_message
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_alert
CREATE POLICY "alert_select" ON assistant_alert
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "alert_insert" ON assistant_alert
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "alert_update" ON assistant_alert
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()))
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_report
CREATE POLICY "report_select" ON assistant_report
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "report_insert" ON assistant_report
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_renewal
CREATE POLICY "renewal_select" ON assistant_renewal
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "renewal_insert" ON assistant_renewal
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "renewal_update" ON assistant_renewal
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT private.get_tenant_id())
    AND (SELECT private.get_user_role()) IN ('billing_admin', 'super_admin', 'platform_ops')
  )
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_audit_log（只允许 INSERT，不允许 UPDATE/DELETE 实现不可篡改）
CREATE POLICY "audit_select" ON assistant_audit_log
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "audit_insert" ON assistant_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_config
CREATE POLICY "config_select" ON assistant_config
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "config_insert" ON assistant_config
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "config_update" ON assistant_config
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT private.get_tenant_id())
    AND (SELECT private.get_user_role()) IN ('super_admin', 'platform_ops')
  )
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_permission_rule
CREATE POLICY "permission_select" ON assistant_permission_rule
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "permission_insert" ON assistant_permission_rule
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT private.get_tenant_id())
    AND (SELECT private.get_user_role()) IN ('super_admin', 'platform_ops')
  );

CREATE POLICY "permission_update" ON assistant_permission_rule
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT private.get_tenant_id())
    AND (SELECT private.get_user_role()) IN ('super_admin', 'platform_ops')
  )
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

-- assistant_alert_preference
CREATE POLICY "preference_select" ON assistant_alert_preference
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "preference_insert" ON assistant_alert_preference
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));

CREATE POLICY "preference_update" ON assistant_alert_preference
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT private.get_tenant_id()) AND user_id = auth.uid())
  WITH CHECK (tenant_id = (SELECT private.get_tenant_id()));
