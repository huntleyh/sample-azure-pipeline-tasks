param(
    [string]$statusVariableName,
    [string]$commentVariableName
)

Write-Host "************************************************************************"
Write-Host " Launching GetLastManualInterventionResponse (AgentBased) Task "
Write-Host "************************************************************************"

$token = $env:SYSTEM_ACCESSTOKEN
$restHeader = @{Accept="application/json"; Authorization=("Bearer {0}" -f $token)}

dir env:

$uri = "$($env:SYSTEM_COLLECTIONURI)/$($env:SYSTEM_TEAMPROJECT)/_apis/Release/releases/$($env:RELEASE_RELEASEID)/manualinterventions?api-version=5.0"
#$uri = "https://vsrm.dev.azure.com/huntleyh/Parts Unlimited-v2/_apis/Release/releases/106/manualinterventions?api-version=5.0"

$result = Invoke-RestMethod -Method GET -Uri $uri -Headers $restHeader

if($result -ne $null -and $result.count -ne $null -and $result.count -gt 0)
{
    $manualIntervention = $result.value[$result.count - 1]

    Write-Host "Result: $($manualIntervention.status)"
    Write-Host "Result: $($manualIntervention.comments)"

    $encodedComment = [System.Web.HttpUtility]::UrlEncode($($manualIntervention.comments))

    Write-Host "Encoded: $encodedComment"

    Write-Host "##vso[task.setvariable variable=$statusVariableName;isOutput=true]$($manualIntervention.status)"
    Write-Host "##vso[task.setvariable variable=$commentVariableName;isOutput=true]$($encodedComment)"
}
else
{
    throw "Unable to retrieve Manual Interventions on this release ('$(Release.ReleaseId)')"
}