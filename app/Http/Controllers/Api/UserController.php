<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return User::select('id', 'name', 'email')
            ->where('id', '!=', $request->user()->id)
            ->orderBy('name')
            ->get();
    }
}
