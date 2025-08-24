"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // <--- state loading
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true); // mulai loading

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    console.log("Login response:", res);

    if (res?.error) {
      setError("Email atau password salah");
    } else {
      router.push("/teams");
    }

    setLoading(false); // selesai loading
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4">Login Admin</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 mb-3 w-full rounded"
          required
          disabled={loading} // disable input saat loading
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 mb-3 w-full rounded"
          required
          disabled={loading} // disable input saat loading
        />
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          className={`p-2 w-full rounded text-white ${loading ? "bg-gray-400" : "bg-blue-600"}`}
          disabled={loading} // disable tombol saat loading
        >
          {loading ? "Loading..." : "Login"} {/* tampilkan loading */}
        </button>
      </form>
    </div>
  );
}
