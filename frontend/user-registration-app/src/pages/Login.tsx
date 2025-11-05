import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '../hooks/useLoginMutation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Use login mutation which delegates to AuthProvider
  const loginMutation = useLoginMutation();
  const { mutate: loginMutate, isLoading: loginLoading, isError: loginIsError, error: loginError } = loginMutation as any;

  const onSubmit = async (data: LoginFormData) => {
    loginMutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-gray-200">
  <h2 className="text-2xl text-purple-500 font-bold text-center mb-8">Sign In</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
            {loginIsError && (
              <p className="mt-4 text-center text-sm text-red-600">{
                (loginError as any)?.response?.data?.message || 'Login failed. Please check your credentials.'
              }</p>
            )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-600">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}