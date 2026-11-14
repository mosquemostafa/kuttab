"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerPage() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const previous =
      typeof window !== "undefined"
        ? window.localStorage.getItem("theme")
        : null;
    setTheme("light");
    return () => {
      if (
        previous === "light" ||
        previous === "dark" ||
        previous === "system"
      ) {
        setTheme(previous);
      } else {
        setTheme("system");
      }
    };
  }, [setTheme]);

  return (
    <div
      dir="ltr"
      lang="en"
      style={{
        width: "100%",
        height: "100vh",
        colorScheme: "light",
        backgroundColor: "#fff",
        color: "#3b4151",
      }}
    >
      <SwaggerUI
        url="/api/swagger.json"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        deepLinking
        filter
        requestInterceptor={(req) => {
          // Same-origin Try it out: send session cookie after sign-in for cookieAuth routes.
          req.credentials = "include";
          return req;
        }}
        onComplete={() => {
          console.log("Swagger UI loaded");
        }}
      />
    </div>
  );
}
