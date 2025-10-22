import { useState } from 'react';
import { Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { userAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = userAuthStore((state) => state.login)
  const loading = userAuthStore((state) => state.loading)
  const error = userAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset
  } = useForm({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    const success = await login(data);
    if (success) {
      toast.success('Login realizado com sucesso!');
      reset(); 
      navigate("/dashboard");
    } else {
      setError("root", {
        message: error || "Login failed"
      });
      toast.error(error || "Login failed");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='w-full'>
      <form className='space-y-4 md:space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* Show general form errors */}
        {errors.root && (
          <div className="p-3 rounded text-sm md:text-base bg-red-50 border border-red-400 text-red-700">
            {errors.root.message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded text-sm md:text-base bg-red-50 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className='block text-sm font-medium mb-1 text-gray-700'>
            Email
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className='h-4 w-4 md:h-5 md:w-5  text-gray-400' />
            </div>
            <input
              id='email'
              {...register("email")}
              type='email'
              placeholder='Digite seu e-mail'
              className='w-full pl-10 pr-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white border-gray-300 text-gray-900'
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs md:text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Password Field */}
        <div>
          <label htmlFor="password" className='block text-sm font-medium mb-1 text-gray-700'>
            Password
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
            </div>
            <input
              id="password"
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              className='w-full pl-10 pr-10 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white border-gray-300 text-gray-900'
            />
            <button
              type='button'
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className='h-4 w-4 md:h-5 md:w-5 text-gray-500 hover:text-gray-700' />
              ) : (
                <Eye className='h-4 w-4 md:h-5 md:w-5 text-gray-500 hover:text-gray-700' />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs md:text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className='flex items-center justify-end'>
          <a href="#" className='text-xs md:text-sm text-cyan-600 hover:text-cyan-700'>
            Forget your password?
          </a>
        </div>
        <button type='submit'
          disabled={isSubmitting || loading}
          className='w-full py-2 px-4 text-sm md:text-base text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 focus:ring-offset-2'
        >
          {isSubmitting || loading ? (
            <span className="flex items-center justify-center">
              <span className='loading loading-infinity loading-lg'>
                Logging in...
              </span>
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className='relative my-4 md:my-6'>
        <div className="absolute inset-0 flex items-center">
          <div className='w-full border-t border-gray-300'></div>
        </div>
        <div className='relative flex justify-center text-xs md:text-sm'>
          <span className='px-2 bg-white text-gray-500'>
            Don't have an account?
          </span>
        </div>
      </div>
      <button
        type='button'
        onClick={() => window.location.href = '/register'}
        className='w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-md transition-colors text-sm md:text-base bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
      >
        <span className='ml-1'>Cadastrar-se</span>
      </button>
    </div>
  );
}

export default LoginForm;