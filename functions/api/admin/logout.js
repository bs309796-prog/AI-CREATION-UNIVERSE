
export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Admin logged out successfully."
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "acu_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0"
      }
    }
  );
}
