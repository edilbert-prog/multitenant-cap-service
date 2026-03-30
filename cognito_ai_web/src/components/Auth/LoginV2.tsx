import React from "react";
import LoginBG from "../../assets/LoginBG.png";
import { FaRegQuestionCircle } from "react-icons/fa";
import LogoNew from "../../assets/LogoNew.svg";
import AuthService from "../../utils/AuthService";

type Props = {};

export default function LoginV2(_props: Props) {
    const handleLogin = () => {
        AuthService.keyLogin();
    };

    return (
        <div className="relative h-screen w-full flex">
            <img
                src={LoginBG}
                alt="Decorative background"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
            />

            <div className="absolute inset-0 bg-[#0071E9]/30" />

            <div className="relative z-10 flex w-full items-center justify-end pr-16">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-[360px]" role="dialog" aria-labelledby="loginTitle">
                    <img src={LogoNew} alt="Logo" className="h-7" />
                    <p className="text-[#8A8A8A] text-xs pt-2 mb-8">AI-Driven Test Life Cycle Management</p>

                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-medium text-[#1A1A1A] mb-2">Welcome Back</h2>
                            <p className="text-[#8A8A8A] text-sm">Sign in to continue to your account</p>
                        </div>

                        <button
                            onClick={handleLogin}
                            className="w-full text-lg bg-[#0071E9] hover:bg-[#6a3ce0] text-white py-2.5 mt-4 rounded-md font-medium transition"
                        >
                            Sign in
                        </button>
                    </div>

                    <div className="flex font-medium items-center px-4 border-t pb-4 border-t-[#F1F1F1] pt-4 justify-center gap-2 mt-8 text-xs text-gray-600">
                        <FaRegQuestionCircle size={25} aria-hidden={true} />
                        <span>Contact your admin if you forgot your username or password.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}