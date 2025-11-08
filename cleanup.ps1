# Script to clean up duplicate and mock files

# Files to delete
$filesToDelete = @(
    "src/services/authService.ts",
    "src/services/bookingService.ts",
    "src/services/consultationService.ts",
    "src/services/paymentService.ts",
    "src/services/professionalFilterService.ts",
    "src/services/professionalService.ts",
    "src/services/professionalSlotService.ts",
    "src/services/professionalSlotsService.ts",
    "src/services/reviewService.ts",
    "src/services/yogaClassesService.ts",
    "src/utils/phonepePayment.ts",
    "src/utils/mockPhonePePayment.ts",
    "src/utils/yogaUtils.ts",
    "src/utils/UserContext.tsx",
    "src/screens/ProfessionalDetailsScreen.tsx",
    "src/screens/AppointmentsScreen.tsx"
)

# Folders to delete
$foldersToDelete = @(
    "src/features"
)

Write-Host "Starting cleanup..." -ForegroundColor Green

# Delete files
foreach ($file in $filesToDelete) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        Remove-Item -Path $filePath -Force
        Write-Host "Deleted: $file" -ForegroundColor Yellow
    } else {
        Write-Host "Not found (skipping): $file" -ForegroundColor Gray
    }
}

# Delete folders
foreach ($folder in $foldersToDelete) {
    $folderPath = Join-Path $PSScriptRoot $folder
    if (Test-Path $folderPath) {
        Remove-Item -Path $folderPath -Recurse -Force
        Write-Host "Deleted folder: $folder" -ForegroundColor Yellow
    } else {
        Write-Host "Folder not found (skipping): $folder" -ForegroundColor Gray
    }
}

Write-Host "\nCleanup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run build' to check for any broken imports" -ForegroundColor Cyan
Write-Host "2. Fix any import errors that appear" -ForegroundColor Cyan
