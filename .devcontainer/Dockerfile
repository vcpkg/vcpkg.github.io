FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:24

ENV PS_INSTALL_FOLDER=/opt/microsoft/powershell
ENV PSModuleAnalysisCachePath=/var/cache/microsoft/powershell/PSModuleAnalysisCache/ModuleAnalysisCache

RUN mkdir -p ${PS_INSTALL_FOLDER} \
    && case "$(uname -m)" in \
          amd64) PS_ARCH=x64 ;; \
          x86_64) PS_ARCH=x64 ;; \
          arm64) PS_ARCH=arm64 ;; \
          aarch64) PS_ARCH=arm64 ;; \
          *) echo "Unsupported architecture: $(uname -m)" && exit 1 ;; \
        esac \
    && curl -L https://github.com/PowerShell/PowerShell/releases/download/v7.6.0/powershell-7.6.0-linux-${PS_ARCH}.tar.gz --output - \
        | tar xzf - -C ${PS_INSTALL_FOLDER} \
    && chmod a+x,o-w ${PS_INSTALL_FOLDER}/pwsh \
    && ln -s ${PS_INSTALL_FOLDER}/pwsh /usr/bin/pwsh \
    && pwsh \
        -NoLogo \
        -NoProfile \
        -Command " \
          \$ErrorActionPreference = 'Stop' ; \
          \$ProgressPreference = 'SilentlyContinue' ; \
          while(!(Test-Path -Path \$env:PSModuleAnalysisCachePath)) {  \
            Write-Host "'Waiting for $env:PSModuleAnalysisCachePath'" ; \
            Start-Sleep -Seconds 6 ; \
          }"
