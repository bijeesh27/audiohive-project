
interface inputPurpose{
  type?:string
  placeHolder:string
  value?:string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const Input = ({type,placeHolder,value,onChange, readOnly}:inputPurpose) => {
    
  return (
    <div className="w-full max-w-sm min-w-50">
      <input type={type} placeholder={placeHolder} value={value} onChange={onChange} readOnly={readOnly} className={`w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease-collapse focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow-md ${readOnly ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`}/>
    </div>
  )
}

export default Input
