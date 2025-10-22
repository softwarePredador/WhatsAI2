import Logo from "./Logo";
import Navbar from "./Navbar";
import UserMenu from "./UserMenu";

function Header(){
  return (
  <>
  <div className="h16 sm:h-20"></div>
    <div className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 shadow-md backdrop-blur-sm transition-colors duration-300 bg-white/30 dark:bg-gray-900/30 text-black dark:text-white">
      <div className="flex items-center justify-between h-full px-2 sm:px-4">
      <Logo/>
      <Navbar/>
      <div className="hidden md:flex items-center space-x-4">
      <UserMenu/>
      </div>
      </div>
    </div>
  </>
  )
}

export default Header;