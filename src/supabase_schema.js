const supabaseSchema = {
  [
  {
    "policy_name": "Leader full access",
    "schema": "public",
    "table_name": "attendance",
    "command": "ALL",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scout can view own attendance",
    "schema": "public",
    "table_name": "attendance",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(id IN ( SELECT attendance_scouts.attendance_id\n   FROM attendance_scouts\n  WHERE (attendance_scouts.scout_id IN ( SELECT scouts.id\n           FROM scouts\n          WHERE ((scouts.email)::text = auth.email())))))",
    "with_check": null
  },
  {
    "policy_name": "Leader full access",
    "schema": "public",
    "table_name": "attendance_scouts",
    "command": "ALL",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scout can view own attendance_scouts",
    "schema": "public",
    "table_name": "attendance_scouts",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(scout_id IN ( SELECT scouts.id\n   FROM scouts\n  WHERE ((scouts.email)::text = auth.email())))",
    "with_check": null
  },
  {
    "policy_name": "Leader full access to badges",
    "schema": "public",
    "table_name": "badges",
    "command": "ALL",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scouts can view all badges",
    "schema": "public",
    "table_name": "badges",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "true",
    "with_check": null
  },
  {
    "policy_name": "Leaders can manage leader info",
    "schema": "public",
    "table_name": "leader_info",
    "command": "ALL",
    "roles": "{authenticated}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scouts can read leader info",
    "schema": "public",
    "table_name": "leader_info",
    "command": "SELECT",
    "roles": "{authenticated}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'scout'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Leaders can manage notices",
    "schema": "public",
    "table_name": "notices",
    "command": "ALL",
    "roles": "{authenticated}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scouts can read active notices",
    "schema": "public",
    "table_name": "notices",
    "command": "SELECT",
    "roles": "{authenticated}",
    "using_expression": "((active = true) AND (EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'scout'::text)))))",
    "with_check": null
  },
  {
    "policy_name": "Leader full access",
    "schema": "public",
    "table_name": "scout_badges",
    "command": "ALL",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scout can view own badges",
    "schema": "public",
    "table_name": "scout_badges",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(scout_id IN ( SELECT scouts.id\n   FROM scouts\n  WHERE ((scouts.email)::text = auth.email())))",
    "with_check": null
  },
  {
    "policy_name": "scout_history_insert_policy",
    "schema": "public",
    "table_name": "scout_history",
    "command": "INSERT",
    "roles": "{public}",
    "using_expression": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))"
  },
  {
    "policy_name": "scout_history_select_policy",
    "schema": "public",
    "table_name": "scout_history",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "scout_history_update_policy",
    "schema": "public",
    "table_name": "scout_history",
    "command": "UPDATE",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Leader full access",
    "schema": "public",
    "table_name": "scouts",
    "command": "ALL",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles\n  WHERE ((userroles.user_id = auth.uid()) AND ((userroles.userrole)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Allow individual scout to insert their own profile",
    "schema": "public",
    "table_name": "scouts",
    "command": "INSERT",
    "roles": "{authenticated}",
    "using_expression": "((email)::text = auth.email())",
    "with_check": "((email)::text = auth.email())"
  },
  {
    "policy_name": "Scout can view own record",
    "schema": "public",
    "table_name": "scouts",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "((email)::text = auth.email())",
    "with_check": null
  },
  {
    "policy_name": "Leader can delete roles",
    "schema": "public",
    "table_name": "userroles",
    "command": "DELETE",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles ur\n  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Leader can insert roles",
    "schema": "public",
    "table_name": "userroles",
    "command": "INSERT",
    "roles": "{public}",
    "using_expression": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM userroles ur\n  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = 'leader'::text))))"
  },
  {
    "policy_name": "Leader can update roles",
    "schema": "public",
    "table_name": "userroles",
    "command": "UPDATE",
    "roles": "{public}",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM userroles ur\n  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = 'leader'::text))))",
    "with_check": null
  },
  {
    "policy_name": "Scout can view own role",
    "schema": "public",
    "table_name": "userroles",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "policy_name": "User can view own role",
    "schema": "public",
    "table_name": "userroles",
    "command": "SELECT",
    "roles": "{public}",
    "using_expression": "(user_id = auth.uid())",
    "with_check": null
  }
]
[
  {
    "table_name": "attendance",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "attendance",
    "column_name": "date",
    "data_type": "date"
  },
  {
    "table_name": "attendance",
    "column_name": "activity_type",
    "data_type": "character varying"
  },
  {
    "table_name": "attendance",
    "column_name": "custom_activity_name",
    "data_type": "character varying"
  },
  {
    "table_name": "attendance",
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "table_name": "attendance",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "attendance_scouts",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "attendance_scouts",
    "column_name": "attendance_id",
    "data_type": "integer"
  },
  {
    "table_name": "attendance_scouts",
    "column_name": "scout_id",
    "data_type": "integer"
  },
  {
    "table_name": "badges",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "badges",
    "column_name": "name",
    "data_type": "character varying"
  },
  {
    "table_name": "badges",
    "column_name": "description",
    "data_type": "text"
  },
  {
    "table_name": "badges",
    "column_name": "requirements",
    "data_type": "text"
  },
  {
    "table_name": "badges",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "badges",
    "column_name": "badge_type",
    "data_type": "character varying"
  },
  {
    "table_name": "debug_logs",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "debug_logs",
    "column_name": "timestamp",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "debug_logs",
    "column_name": "message",
    "data_type": "text"
  },
  {
    "table_name": "debug_logs",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "debug_logs",
    "column_name": "extra_data",
    "data_type": "jsonb"
  },
  {
    "table_name": "leader_info",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "leader_info",
    "column_name": "content",
    "data_type": "text"
  },
  {
    "table_name": "leader_info",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "leader_info",
    "column_name": "updated_by",
    "data_type": "uuid"
  },
  {
    "table_name": "notices",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "notices",
    "column_name": "title",
    "data_type": "text"
  },
  {
    "table_name": "notices",
    "column_name": "description",
    "data_type": "text"
  },
  {
    "table_name": "notices",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "notices",
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "table_name": "notices",
    "column_name": "active",
    "data_type": "boolean"
  },
  {
    "table_name": "scout_badges",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "scout_badges",
    "column_name": "scout_id",
    "data_type": "integer"
  },
  {
    "table_name": "scout_badges",
    "column_name": "badge_id",
    "data_type": "integer"
  },
  {
    "table_name": "scout_badges",
    "column_name": "date_earned",
    "data_type": "date"
  },
  {
    "table_name": "scout_badges",
    "column_name": "awarded_by",
    "data_type": "uuid"
  },
  {
    "table_name": "scout_badges",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scout_history",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "scout_history",
    "column_name": "scout_id",
    "data_type": "integer"
  },
  {
    "table_name": "scout_history",
    "column_name": "rank",
    "data_type": "character varying"
  },
  {
    "table_name": "scout_history",
    "column_name": "crew",
    "data_type": "character varying"
  },
  {
    "table_name": "scout_history",
    "column_name": "start_date",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scout_history",
    "column_name": "end_date",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scout_history",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scouts",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "scouts",
    "column_name": "full_name",
    "data_type": "character varying"
  },
  {
    "table_name": "scouts",
    "column_name": "crew",
    "data_type": "character varying"
  },
  {
    "table_name": "scouts",
    "column_name": "email",
    "data_type": "character varying"
  },
  {
    "table_name": "scouts",
    "column_name": "rank",
    "data_type": "character varying"
  },
  {
    "table_name": "scouts",
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "table_name": "scouts",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scouts",
    "column_name": "registration_token",
    "data_type": "character varying"
  },
  {
    "table_name": "scouts",
    "column_name": "registration_token_expires",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "scouts",
    "column_name": "password",
    "data_type": "text"
  },
  {
    "table_name": "scouts",
    "column_name": "reset_token",
    "data_type": "text"
  },
  {
    "table_name": "scouts",
    "column_name": "reset_token_created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "userroles",
    "column_name": "id",
    "data_type": "integer"
  },
  {
    "table_name": "userroles",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "userroles",
    "column_name": "userrole",
    "data_type": "character varying"
  },
  {
    "table_name": "userroles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "userroles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]
  // Your Supabase database schema and RLS policies will go here in JSON format.
  // Example:
  // tables: [
  //   {
  //     name: "scouts",
  //     columns: [
  //       { name: "id", type: "uuid", primaryKey: true },
  //       { name: "name", type: "text" },
  //       { name: "rank", type: "text" },
  //       { name: "crew", type: "text" },
  //       { name: "email", type: "text", unique: true },
  //       { name: "token", type: "text" },
  //     ],
  //     rls: [
  //       { policy_name: "Allow all for leaders", definition: "(uid() IS NOT NULL)" },
  //     ],
  //   },
  // ],
  // rls_policies: [
  //   // RLS policies here
  // ],
};

export default supabaseSchema;

{
  "function_name": "get_user_id_by_email",
  "returns": "uuid",
  "args": [
    {
      "name": "p_email",
      "type": "text"
    }
  ]
}