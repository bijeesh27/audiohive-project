export interface RegisterDTO{
    username:string;
    email:string;
    password:string
}

export interface OtpDTO{
    otp:string,
    purpose:string
}

export interface LoginDTO{
    email:string;
    password:string;
}

export interface ForgetPasswordDTO{
    email:string
}
export interface ChangePasswordDTO{
    oldPassword:string;
    password:string
}