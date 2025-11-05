import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="w-full space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold p-1 text-purple-500 tracking-tighter sm:text-4xl md:text-5xl">
              Welcome
            </h1>
            <p className="text-muted-foreground">
              Please choose an option to continue
            </p>
          </div>
          <div className="space-y-4">
            <Button asChild className="w-full" variant="default">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="w-full" variant="default">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


