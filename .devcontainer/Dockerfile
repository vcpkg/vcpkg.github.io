FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:20

ENV PS_INSTALL_FOLDER=/opt/microsoft/powershell
ENV PSModuleAnalysisCachePath=/var/cache/microsoft/powershell/PSModuleAnalysisCache/ModuleAnalysisCache

RUN mkdir -p ${PS_INSTALL_FOLDER} \
    && (curl -L https://github.com/PowerShell/PowerShell/releases/download/v7.4.1/powershell-7.4.1-linux-x64.tar.gz --output - \
        | tar xzf - -C ${PS_INSTALL_FOLDER}) \
    && chmod a+x,o-w ${PS_INSTALL_FOLDER}/pwsh \
    && ln -s ${PS_INSTALL_FOLDER}/pwsh /usr/bin/pwsh \
    && ln -s ${PS_INSTALL_FOLDER}/pwsh /usr/bin/pwsh-lts \
    && export POWERSHELL_TELEMETRY_OPTOUT=1 \
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
