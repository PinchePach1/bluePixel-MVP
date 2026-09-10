import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isLoginPage = req.nextUrl.pathname === "/login";

        if (isLoginPage && isAuth) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if (!isAuth && !isLoginPage) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) =>
                !!token || req.nextUrl.pathname === "/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/api/requests/:path*", "/login"],
};