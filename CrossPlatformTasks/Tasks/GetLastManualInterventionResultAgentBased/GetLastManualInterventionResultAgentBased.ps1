Trace-VstsEnteringInvocation $MyInvocation

$statusVariableName = Get-VstsInput -Name "statusVariableName" -Require
$commentVariableName = Get-VstsInput -Name "commentVariableName" -Require

& "$PSScriptRoot\worker.ps1" -statusVariableName $statusVariableName -commentVariableName $commentVariableName
