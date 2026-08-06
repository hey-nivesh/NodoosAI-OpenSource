function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const mockClient = {
    auth: {
      getUser: async () => {
        const token = getCookie("nodoos-admin-session");
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
        const token = getCookie("nodoos-admin-session");
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
      signInWithPassword: async ({ email, password }: any) => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
          const res = await fetch(`${apiBase}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: email, password })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { data: null, error: { message: err.detail || "Invalid credentials" } };
          }
          const data = await res.json();
          const token = data.access_token;
          document.cookie = `nodoos-admin-session=${token}; path=/; max-age=86400; SameSite=Lax`;
          return {
            data: {
              user: {
                id: "admin-uuid-1111-2222-3333-4444",
                email: "admin@nodoos.ai"
              },
              session: {
                access_token: token
              }
            },
            error: null
          };
        } catch (err: any) {
          return { data: null, error: { message: err.message || "Failed to authenticate" } };
        }
      },
      signOut: async () => {
        document.cookie = "nodoos-admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
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

  cachedClient = mockClient as any;
  return cachedClient;
}
