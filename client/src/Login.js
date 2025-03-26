import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { ToastContainer, toast } from "react-toastify";

export default function Login() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User created successfully!");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-semibold text-center">
          {isSignUp ? "Sign Up" : "Login"}
        </h2>
        <button
          className="rounded-md p-4"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          Switch to {isSignUp ? "Login" : "Sign Up"}
        </button>

        <form className="mt-4" onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <input
              type="name"
              placeholder="Name"
              className="w-full p-2 mb-2 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            className="w-full bg-blue-500 text-white py-2 rounded mt-2"
            onClick={handleLogin}
          >
            Login
          </button>
          <button
            className="w-full bg-green-500 text-white py-2 rounded mt-2"
            onClick={handleSignUp}
          >
            Sign Up
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
