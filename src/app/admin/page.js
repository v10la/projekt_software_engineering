import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div style={{ padding: 24 }}>Not logged in.</div>;
  }

  if (session.user.role !== "admin") {
    return <div style={{ padding: 24 }}>Forbidden: Admins only.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Area</h1>
      <p>Signed in as: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}