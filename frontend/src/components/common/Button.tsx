
interface buttonPurpose{
  label:string;
  buttonType?:"submit" | "reset" | "button";
  
}

const Button = ({label,buttonType}:buttonPurpose) => {
  return (
    <div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 mt-2" type={buttonType}>{label}</button>
    </div>
  )
}

export default Button
