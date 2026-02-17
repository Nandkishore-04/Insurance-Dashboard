import { useState } from 'react'
import { Shield, Key, Eye, EyeOff, Lock, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { login, register, hasUsers } = useAuth()
    const [isSetup, setIsSetup] = useState(() => !hasUsers())

    // Form states
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = (e) => {
        e.preventDefault()
        if (!username || !password) return
        login(username, password)
    }

    const handleRegister = (e) => {
        e.preventDefault()
        if (!username || !password || !name) return
        const success = register({ username, password, name })
        if (success) setIsSetup(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-[440px] z-10">
                {/* Branding Header */}
                <div className="text-center mb-10 transition-all duration-500 transform">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-primary-500 to-primary-600 shadow-2xl shadow-primary-500/30 mb-8 border border-white/10 rotate-3 hover:rotate-6 transition-transform duration-300">
                            <Shield className="w-12 h-12 text-white drop-shadow-lg" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3 bg-clip-text text-transparent bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-secondary)]">
                        {isSetup ? 'System Setup' : 'Dashboard Access'}
                    </h1>
                    <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest opacity-80">
                        {isSetup ? 'Create your administrator account' : 'Enterprise Insurance Management'}
                    </p>
                </div>

                {/* Login/Signup Card */}
                <div className="relative group">
                    {/* Subtle Outer Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/10 to-emerald-500/10 rounded-[3rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                    <div className="relative bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                        <form onSubmit={isSetup ? handleRegister : handleLogin} className="space-y-6" data-testid="login-form">

                            {isSetup && (
                                <div className="space-y-2 group/field">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2 group-focus-within/field:text-primary-500 transition-colors">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within/field:text-primary-500 transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-2xl pl-11 pr-4 py-4 outline-none transition-all focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 placeholder:text-[var(--text-muted)]/40 font-semibold"
                                            placeholder="Admin Name"
                                            data-testid="input-fullname"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 group/field">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2 group-focus-within/field:text-primary-500 transition-colors">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within/field:text-primary-500 transition-colors">
                                        {isSetup ? <UserPlus className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-2xl pl-11 pr-4 py-4 outline-none transition-all focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 placeholder:text-[var(--text-muted)]/40 font-semibold"
                                        placeholder={isSetup ? "Create username" : "Username"}
                                        data-testid="input-username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group/field">
                                <div className="flex items-center justify-between px-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-focus-within/field:text-primary-500 transition-colors">
                                        Security Key
                                    </label>
                                    {!isSetup && (
                                        <button type="button" className="text-[10px] font-bold text-primary-500 hover:underline">
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within/field:text-primary-500 transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-2xl pl-11 pr-12 py-4 outline-none transition-all focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 placeholder:text-[var(--text-muted)]/40 font-semibold tracking-wider"
                                        placeholder={isSetup ? "Create secure key" : "••••••••"}
                                        data-testid="input-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        data-testid="btn-toggle-password"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full relative group overflow-hidden bg-primary-600 hover:bg-primary-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-primary-500/25 transition-all active:scale-[0.97] mt-4"
                                data-testid="btn-login-submit"
                            >
                                <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-full group-hover:animate-[shimmer_0.6s_infinite]" />
                                <span className="flex items-center justify-center gap-3">
                                    {isSetup ? 'Initialize System' : 'Verified Access'}
                                    <Key className="w-4 h-4" />
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-10 text-center space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 flex items-center justify-center gap-4">
                        <span className="w-8 h-px bg-[var(--border-color)]" />
                        Insurance Tracking v1.0.4
                        <span className="w-8 h-px bg-[var(--border-color)]" />
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-[var(--text-muted)]">
                        <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            Secure Offline Mode
                        </span>
                        <span className="opacity-40">|</span>
                        <span className="hover:text-[var(--text-primary)] cursor-help transition-colors">Privacy Policy</span>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes shimmer {
          100% { transform: translateX(300%) skewx(-30deg); }
        }
      `}} />
        </div>
    )
}
