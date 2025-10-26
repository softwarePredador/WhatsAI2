import Logo from "./Logo";
import Navbar from "./Navbar";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";

function Header(){
  return (
  <>
  <div className="h-16 sm:h-20"></div>
    <div className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 shadow-lg backdrop-blur-md transition-colors duration-300 bg-base-100/80 border-b border-base-300">
      <div className="flex items-center justify-between h-full px-2 sm:px-4">
      <Logo/>
      <Navbar/>
      <div className="hidden md:flex items-center space-x-4">
        <ThemeToggle />
        <UserMenu/>
      </div>
      </div>
    </div>
  </>
  )
}

export default Header;