import React, { useEffect, useMemo, useRef, useState } from "react";
import LoginBG from "../../assets/LoginBG.png";
import { apiRequest } from "../../utils/helpers/ApiHelper";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { FaEye, FaEyeSlash, FaRegQuestionCircle } from "react-icons/fa";
import LogoNew from "../../assets/LogoNew.svg";
import { storeEncryptedData } from "../../utils/helpers/storageHelper";
import * as cryptojs from "crypto-js";

interface Errors { 
    email: string;
    password: string;
}

type Props = {};

function normalizeEmail(v: string): string {  
    return v.trim().toLowerCase();
}

function normalizePassword(v: string): string {
    return v.replace(/^\s+|\s+$/g, "");
}


export default function Login(_props: Props) { //_props: Props// email
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>({ email: "", password: "" });
    const [isValid, setValid] = useState<boolean>(true);
    const [isSubmitting, setSubmitting] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);

    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const now: number = Date.now();
    const isInCooldown: boolean = now < cooldownUntil;
    const cooldownSeconds: number = Math.ceil((cooldownUntil - now) / 1000);

    const mounted = useRef<boolean>(true);
    useEffect((): (() => void) => { 
        return () => { 
            mounted.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const emailPattern = useMemo<RegExp>(() => "", []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { 
        e.preventDefault();

        if (isSubmitting || isInCooldown) return;

        let valid = true;
        setValid(true);
        const newErrors: Errors = { email: "", password: "" };

        const emailN = normalizeEmail(email);
        const pwdN = normalizePassword(password);

        if (!emailN) { 
            newErrors.email = "Email is required";
            valid = false;
        } else if (!emailPattern.test(emailN) || emailN.length > 254) {
            newErrors.email = "Email is invalid";
            valid = false;
        }

        if (!pwdN) { 
            newErrors.passError = "Password is required";
            valid = false;
        } else if (pwdN.length > 100) {
            newErrors.passError = "Password is too long";
            valid = false;
        }

        setErrors(newErrors);
        if (!valid) return;

        try {
            setSubmitting(true);

            if (abortRef.current) abortRef.current.abort();
            const controller: AbortController = new AbortController();
            abortRef.current = controller;

            const encKey: string = import.meta.env.VITE_AUTH_ENC as string;
            const encryptedPass: string = cryptojs.AES.encrypt(JSON.stringify(password.trim()), encKey).toString();
            const reqObj = {
                email: email.trim(),
                password: encryptedPass,
            };
            const resp: any = await apiRequest("/UserLogin", reqObj as any);
            if (Object.prototype.hasOwnProperty.call(resp, "UserDetails")) {
                storeEncryptedData("UserSession", JSON.stringify(resp.UserDetails));
                navigate("/dashboard");
            } else {
                if (mounted.current) {
                    setValid(false);
                    const nextAttempts = attempts + 1;
                    setAttempts(nextAttempts);
                    if (nextAttempts >= 3) {
                        const cdMs = Math.min(30000, 2000 * 2 ** (nextAttempts - 3));
                        setCooldownUntil(Date.now() + cdMs);
                    }
                }
            }
        } catch (_error) {
            if (mounted.current) {
                setValid(false);
            }
        } finally {
            if (mounted.current) {
                setSubmitting(false);
            }
        }
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

                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A]">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                inputMode="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                autoComplete="username"
                                maxLength={254}
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                className="w-full mt-1 px-4 py-[0.688rem] border border-[#E3E3E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E9]"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? "email-error" : undefined}
                                required
                            />
                            {errors.email && (  
                                <p id="email-error" className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A]">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setPassword(e.target.value)}
                                    placeholder="Enter Password"
                                    className="w-full mt-1 px-4 py-2 border border-[#E3E3E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E9]"
                                    autoComplete="current-password"
                                    maxLength={1024}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={(): void => setShowPassword((prev: boolean) => !prev)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || isInCooldown}
                            className={`w-full text-lg ${
                                isSubmitting || isInCooldown ? "bg-[#a388ff] cursor-not-allowed" : "bg-[#0071E9] hover:bg-[#6a3ce0]"
                            } text-white py-2.5 mt-4 rounded-md font-medium transition`}
                        >
                            {isSubmitting ? "Signing in..." : isInCooldown ? `Try again in ${cooldownSeconds}s` : "Login"}
                        </button>
                    </form>

                    {!isValid && (
                        <div className="py-2 bg-red-100 mt-3 rounded-md px-4" role="alert" aria-live="polite">
                            <p className="text-red-700 text-sm">
                                <Info className="w-5 mr-2 inline-block" />
                                Invalid credentials.
                            </p>
                        </div>
                    )}

                    <div className="flex font-medium items-center px-4 border-t pb-4 border-t-[#F1F1F1] pt-4 justify-center gap-2 mt-8 text-xs text-gray-600">
                        <FaRegQuestionCircle size={25} aria-hidden={true} />
                        <span>Contact your admin if you forgot your username or password.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// give me a clear explan
