import { Link } from 'react-router-dom';
import logoPng from '../images/logo.png';

function Logo() {
  return (
    <div>
      <Link to="/" className='flex flex-row items-center ml-2 transition-transform homer:scale-105'>
        <img src={logoPng} alt="Logo" className='w-12 h-12' />
        <h1 className='text-2xl font-bold ml-2 text-base-content'>Whats<span className='text-primary'>AI</span></h1>
      </Link>
    </div>
  )
}

export default Logo;