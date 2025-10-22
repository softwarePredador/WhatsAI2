import { useState } from 'react';
import { Mail, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { userAuthStore } from '../store/authStore';

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha")
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof schema>;

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const register = userAuthStore((state) => state.register);
  const loading = userAuthStore((state) => state.loading);
  const error = userAuthStore((state) => state.error);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    const { name, email, password } = data;
    const success = await register({ name, email, password });
    
    if (success) {
      toast.success('Conta criada com sucesso!');
      reset();
      navigate("/dashboard");
    } else {
      setError("root", {
        message: error || "Falha ao criar conta"
      });
      toast.error(error || "Falha ao criar conta");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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

        {/* Name Field */}
        <div>
          <label htmlFor="name" className='block text-sm font-medium mb-1 text-gray-700'>
            Nome Completo
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
            </div>
            <input
              id='name'
              {...registerField("name")}
              type='text'
              placeholder='Digite seu nome completo'
              className='w-full pl-10 pr-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white border-gray-300 text-gray-900'
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs md:text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className='block text-sm font-medium mb-1 text-gray-700'>
            Email
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
            </div>
            <input
              id='email'
              {...registerField("email")}
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
            Senha
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
            </div>
            <input
              id="password"
              {...registerField("password")}
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

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className='block text-sm font-medium mb-1 text-gray-700'>
            Confirmar Senha
          </label>
          <div className='relative'>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
            </div>
            <input
              id="confirmPassword"
              {...registerField("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••"
              className='w-full pl-10 pr-10 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white border-gray-300 text-gray-900'
            />
            <button
              type='button'
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? (
                <EyeOff className='h-4 w-4 md:h-5 md:w-5 text-gray-500 hover:text-gray-700' />
              ) : (
                <Eye className='h-4 w-4 md:h-5 md:w-5 text-gray-500 hover:text-gray-700' />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs md:text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button 
          type='submit'
          disabled={isSubmitting || loading}
          className='w-full py-2 px-4 text-sm md:text-base text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 focus:ring-offset-2'
        >
          {isSubmitting || loading ? (
            <span className="flex items-center justify-center">
              <span className='loading loading-infinity loading-lg'>
                Criando conta...
              </span>
            </span>
          ) : (
            "Criar Conta"
          )}
        </button>
      </form>

      <div className='relative my-4 md:my-6'>
        <div className="absolute inset-0 flex items-center">
          <div className='w-full border-t border-gray-300'></div>
        </div>
        <div className='relative flex justify-center text-xs md:text-sm'>
          <span className='px-2 bg-white text-gray-500'>
            Ao criar uma conta, você concorda com nossos termos
          </span>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
