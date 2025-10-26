import React from 'react';
import { Link } from 'react-router-dom';
// import useThemeStore from '../store/themeStore';

type AuthCardProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  linkText: string;
  linkTo: string;
};

function AuthCard({ children, title, subtitle, footerText, linkText, linkTo }: AuthCardProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 py-8 lg:py-12 relative bg-base-100`}>
      
      {/* Top decorative element - usando cores do tema */}
      <div className={`absolute top-0 right-0 w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-bl-full bg-primary/10`}></div>
      
      {/* Main content container */}
      <div className="w-full max-w-md z-10">
        {/* Header section */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className={`text-2xl md:text-3xl font-bold text-base-content`}>{title}</h2>
          <p className={`mt-2 text-primary`}>{subtitle}</p>
        </div>
        
        {/* Form container */}
        <div className={`rounded-xl shadow-md p-4 md:p-6 border bg-base-100 border-base-300`}>
          {children}
        </div>
        
        {/* Footer with link */}
        <div className="mt-6 text-center">
          <p className={`text-base-content/70`}>
            {footerText}{' '}
            <Link to={linkTo} className={`font-medium transition-colors text-primary hover:text-primary-focus`}>
              {linkText}
            </Link>
          </p>
        </div>
        
        {/* Feature bullets - hide on small screens */}
        <div className="mt-8 lg:mt-12 hidden md:block">
          <h3 className={`text-sm font-medium mb-3 text-base-content/80`}>
            FinTrack offers:
          </h3>
          <ul className="space-y-2">
            {['Secure financial tracking', 'Easy budget management', 'Comprehensive financial insights'].map((feature, index) => (
              <li key={index} className={`flex items-center text-sm text-base-content/60`}>
                <svg 
                  className={`h-4 w-4 mr-2 text-primary`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20">
                  <path fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Bottom decorative element - usando cores do tema */}
      <div className={`absolute bottom-0 left-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-tr-full bg-primary/10`}></div>
    </div>
  );
}

export default AuthCard;