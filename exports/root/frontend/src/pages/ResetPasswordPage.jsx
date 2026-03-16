import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { verifyResetToken, resetPasswordWithToken } from '../services/api';
import { Lock, CheckCircle, XCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        setTokenMessage('No reset token provided');
        return;
      }

      try {
        const result = await verifyResetToken(token);
        setIsValidToken(result.valid);
        setTokenMessage(result.message);
      } catch (error) {
        setIsValidToken(false);
        setTokenMessage('Error verifying reset link');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPasswordWithToken(token, password);
      
      if (result.success) {
        setIsSuccess(true);
        toast({ title: 'Success!', description: result.message });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to reset password', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-red-600/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
            <p className="text-slate-400 mb-6">{tokenMessage}</p>
            <Button
              onClick={() => navigate('/account')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-green-600/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
            <p className="text-slate-400 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              onClick={() => navigate('/account')}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="go-to-login-btn"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
            alt="Fin & Feathers"
            className="max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
          <p className="text-slate-400 mt-2">Enter your new password below</p>
        </div>

        <Card className="bg-slate-900 border-red-600/30">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                    required
                    data-testid="new-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                  data-testid="confirm-new-password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg mt-6"
                data-testid="reset-password-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/account')}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
