import { z } from "zod";

// Email pattern: any local part ending with @asu.edu
const emailPattern = /^[^\s@]+@asu\.edu$/;

// Password pattern: at least 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and 6-10 characters long
export const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,10}$/;

export const Signup = z.object({
  email: z
    .string()
    .email({ message: "Please provide a valid @asu.edu email" })
    .regex(emailPattern, {
      message: "Email must be a valid registered @asu.edu",
    }),
  name: z
    .string()
    .min(5, { message: "Name must be minimum 5 characters long" }),
  password: z
    .string()
    .min(6, { message: "Password must be minimum 6 characters long" })
    .max(10, { message: "Password must be maximum 10 characters long" })
    .regex(passwordPattern, {
      message:
        "Password must contain at least one uppercase('A-Z') letter, one lowercase('a-z') letter, one digit(0-9), and one special character",
    }),
  college: z.enum(["West", "Poly", "Downtown", "Tempe", "Online"], {
    errorMap: () => ({ message: "Please select a valid campus" }),
  }),
  phoneNo: z.coerce.string().refine((val) => /^\d{10}$/.test(val), {
    message: "Phone no. must be exactly 10 digits and contain only numbers",
  }),
  image: z.string(),
});

export const Login = z.object({
  email: z
    .string()
    .email({ message: "Please provide a valid @asu.edu email" })
    .regex(emailPattern, {
      message: "Email must be a valid registered @asu.edu",
    }),
  password: z.string(),
});
