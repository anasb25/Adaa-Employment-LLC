import React from "react";
import { Link } from "react-router";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl";
  logoSize?: number;
  href?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true,
  textSize = "lg",
  logoSize = 32,
  href = "/",
}) => {
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const logoElement = (
    <div className={`flex items-center ${className}`}>
      <img
        src="/images/logo/logo-icon.png"
        alt="ADAA Employment LLC Logo"
        width={logoSize}
        height={logoSize}
        className="block dark:invert"
        style={{ minWidth: logoSize, minHeight: logoSize }}
      />
      {showText && (
        <span
          className={`ml-3 text-black dark:text-white font-semibold ${textSizeClasses[textSize]}`}
        >
          ADAA Employment LLC
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-block">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
