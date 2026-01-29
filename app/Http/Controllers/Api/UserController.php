<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\User\UserService;

class UserController extends Controller
{
    protected $service;
    public function __construct(UserService $userService)
    {
        $this->service = $userService;
    }

    public function index(Request $request)
    {
        return $this->service->searchUsers($request);
    }
}
