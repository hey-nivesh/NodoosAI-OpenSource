import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  const token = cookieStore.get("nodoos-admin-session")?.value;

  const mockClient = {
    auth: {
      getUser: async () => {
        if (!token) return { data: { user: null }, error: null };
        return {
          data: {
            user: {
              id: "admin-uuid-1111-2222-3333-4444",
              email: "admin@nodoos.ai",
              user_metadata: { full_name: "Admin" }
            }
          },
          error: null
        };
      },
      getSession: async () => {
        if (!token) return { data: { session: null }, error: null };
        return {
          data: {
            session: {
              access_token: token,
              user: {
                id: "admin-uuid-1111-2222-3333-4444",
                email: "admin@nodoos.ai",
                user_metadata: { full_name: "Admin" }
              }
            }
          },
          error: null
        };
      },
      signOut: async () => {
        return { error: null };
      },
      updateUser: async ({ data, password }: any) => {
        return { data: { user: { id: "admin-uuid-1111-2222-3333-4444" } }, error: null };
      }
    },
    from: (table: string) => {
      return {
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              if (table === "profiles") {
                return {
                  data: {
                    id: "admin-uuid-1111-2222-3333-4444",
                    full_name: "Admin",
                    role: "admin",
                    avatar_url: null,
                    created_at: new Date().toISOString()
                  },
                  error: null
                };
              }
              return { data: null, error: new Error("Not found") };
            }
          })
        }),
        update: (values: any) => ({
          eq: (column: string, value: any) => ({
            single: async () => ({
              data: { full_name: values.full_name || "Admin" },
              error: null
            })
          })
        })
      };
    }
  };

  return mockClient as any;
}
