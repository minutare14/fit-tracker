"use client";

import React from "react";
import { frontendLogger } from "@/lib/frontend/logger";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected application error",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    frontendLogger.error({
      scope: "app-error-boundary",
      message: error.message || "Unhandled client error",
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light px-6 text-slate-900 dark:bg-background-dark dark:text-slate-100">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-white p-8 shadow-sm dark:bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Application Error</p>
          <h1 className="mt-3 text-2xl font-black">A tela encontrou um erro inesperado.</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {this.state.errorMessage ?? "Tente recarregar a página. Se o erro persistir, revise os dados desta tela."}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark"
              onClick={this.handleRetry}
              type="button"
            >
              Tentar novamente
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-zinc-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
