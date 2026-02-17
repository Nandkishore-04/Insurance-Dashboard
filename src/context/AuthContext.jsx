import { createContext, useContext, useState } from 'react'
import toast from 'react-hot-toast'

const AuthContext = createContext()

function getInitialUser() {
    try {
        const loggedUser = localStorage.getItem('loggedUser')
        return loggedUser ? JSON.parse(loggedUser) : null
    } catch { return null }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser)

    const getUsers = () => {
        const users = localStorage.getItem('users')
        return users ? JSON.parse(users) : []
    }

    const hasUsers = () => {
        return getUsers().length > 0
    }

    const login = (username, password) => {
        const users = getUsers()
        const foundUser = users.find(u => u.username === username && u.password === password)

        if (foundUser) {
            const sessionUser = { username: foundUser.username, name: foundUser.name }
            localStorage.setItem('loggedUser', JSON.stringify(sessionUser))
            setUser(sessionUser)
            toast.success(`Welcome back, ${foundUser.name}!`)
            return true
        } else {
            toast.error('Invalid username or password')
            return false
        }
    }

    const register = (userData) => {
        const users = getUsers()
        if (users.find(u => u.username === userData.username)) {
            toast.error('Username already exists')
            return false
        }

        users.push(userData)
        localStorage.setItem('users', JSON.stringify(users))
        toast.success('Account created successfully')
        return true
    }

    const logout = () => {
        localStorage.removeItem('loggedUser')
        setUser(null)
        toast.success('Signed out successfully')
    }

    const value = {
        user,
        isAuthenticated: !!user,
        loading: false,
        hasUsers,
        login,
        register,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
