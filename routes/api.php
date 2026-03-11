<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\GroupController;
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
    Route::post("/messages/{userId}/seen", [ChatController::class, "markSeen"]);
    Route::get("/groups", [GroupController::class, "index"]);
    Route::post("/groups", [GroupController::class, "store"]);
    Route::get("/groups/{groupId}/messages", [GroupController::class, "messages"]);
    Route::post("/groups/{groupId}/messages", [GroupController::class, "sendMessage"]);
    Route::post("/groups/{groupId}/read", [GroupController::class, "markRead"]);
});

Route::middleware('auth:sanctum')->get('/users', [UserController::class, 'index']);
