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
    <div className={`w-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 py-8 lg:py-12 relative bg-white`}>
      
      {/* Top decorative element - smaller on mobile */}
      <div className={`absolute top-0 right-0 w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-bl-fullbg-cyan-100`}></div>
      
      {/* Main content container */}
      <div className="w-full max-w-md z-10">
        {/* Header section */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className={`text-2xl md:text-3xl font-bold text-gray-800`}>{title}</h2>
          <p className={`mt-2 text-green-600`}>{subtitle}</p>
        </div>
        
        {/* Form container */}
        <div className={`rounded-xl shadow-md p-4 md:p-6 border bg-white border-gray-100`}>
          {children}
        </div>
        
        {/* Footer with link */}
        <div className="mt-6 text-center">
          <p className={`text-gray-600`}>
            {footerText}{' '}
            <Link to={linkTo} className={`font-medium transition-colors text-cyan-600 hover:text-cyan-700`}>
              {linkText}
            </Link>
          </p>
        </div>
        
        {/* Feature bullets - hide on small screens */}
        <div className="mt-8 lg:mt-12 hidden md:block">
          <h3 className={`text-sm font-medium mb-3 text-gray-700`}>
            FinTrack offers:
          </h3>
          <ul className="space-y-2">
            {['Secure financial tracking', 'Easy budget management', 'Comprehensive financial insights'].map((feature, index) => (
              <li key={index} className={`flex items-center text-sm text-gray-600`}>
                <svg 
                  className={`h-4 w-4 mr-2 text-cyan-500`} 
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
      
      {/* Bottom decorative element - smaller on mobile */}
      <div className={`absolute bottom-0 left-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-tr-full bg-cyan-100`}></div>
    </div>
  );
}

export default AuthCard;