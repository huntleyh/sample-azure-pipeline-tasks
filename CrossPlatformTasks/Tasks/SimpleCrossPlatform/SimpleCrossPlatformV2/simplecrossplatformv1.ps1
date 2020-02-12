Trace-VstsEnteringInvocation $MyInvocation

$sampleStringVariable = Get-VstsInput -Name "sampleString" -Require

& "$PSScriptRoot\simplecrossplatformv1-worker.ps1" -sampleStringVariable $sampleStringVariable
