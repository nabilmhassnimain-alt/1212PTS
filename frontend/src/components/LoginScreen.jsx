import { useState } from "react";
import { loginWithCode } from "../api";

export default function LoginScreen({ onLogin }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        try {
            const { role } = await loginWithCode(code.trim());
            onLogin({ role });
        } catch (err) {
            console.error("Login Error details:", err);
            setError(err.message || "Invalid code");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-6 shadow-xl border border-slate-100">
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-xl shadow-lg shadow-indigo-500/20 object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-slate-500">
                        Enter your access code to view the library.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Access code"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-slate-900 text-sm outline-none border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                        {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-600 text-white font-semibold py-3 text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Continue to Library
                    </button>
                </form>

                <p className="text-[10px] text-center text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Codes are validated securely on the server and never exposed to the client.
                </p>
            </div>
        </div>
    );
}
