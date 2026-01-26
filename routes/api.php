<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\UserController;


Route::get('/test', function () {
    return response()->json(['message' => 'API working']);
});

Route::post("/register", [AuthController::class, "register"]);
Route::post("/login", [AuthController::class, "login"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::get("/me", [AuthController::class, "me"]);
    Route::post("/logout", [AuthController::class, "logout"]);
});


Route::middleware("auth:sanctum")->group(function () {
    Route::post("/messages/send", [ChatController::class, "send"]);
    Route::get("/messages/{userId}", [ChatController::class, "inbox"]);
});

Route::middleware('auth:sanctum')->get('/users', [UserController::class, 'index']);