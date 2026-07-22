import { Link } from "react-router-dom"


const Dashboard = () => {
  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-slate-50'>
      <Link to={'/superadmin/getusers'}>get users</Link><br />
      <h1 className='text-xl font-medium text-slate-800'>welcome superadmin..</h1>
    </div>
  )
}

export default Dashboard
