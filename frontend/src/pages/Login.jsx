import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, Sprout } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface grid lg:grid-cols-2">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-primary flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
        
        <div className="relative z-10 flex items-center gap-sm">
          <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
            <Brain className="text-primary w-8 h-8" />
          </div>
          <h1 className="headline-lg text-on-primary m-0">AgriExpert AI</h1>
        </div>

        <div className="relative z-10 max-w-[448px]">
          <h2 className="display-lg text-on-primary mb-6">Empowering Modern Farming</h2>
          <p className="body-lg text-on-primary/90">
            Join thousands of farmers using precision agriculture and AI-driven insights to maximize their crop yields and soil health.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[448px]">
          <div className="lg:hidden flex items-center gap-sm mb-12 justify-center">
             <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Brain className="text-on-primary w-8 h-8" />
            </div>
            <h1 className="headline-lg text-primary m-0">AgriExpert</h1>
          </div>

          <div className="mb-8">
            <h2 className="headline-lg text-on-surface mb-2">Welcome Back</h2>
            <p className="body-lg text-on-surface-variant">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-error/10 border-l-4 border-error text-error p-4 rounded-r-lg mb-6 body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2 w-full">
              <label className="label-sm text-on-surface font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="farmer@gmail.com"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2 w-full">
              <label className="label-sm text-on-surface font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button type="submit" className="mt-2 w-full bg-primary text-on-primary py-3.5 rounded-xl title-md hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98]">
              Sign In
            </button>
          </form>

          <p className="body-md text-on-surface-variant text-center mt-8">
            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
