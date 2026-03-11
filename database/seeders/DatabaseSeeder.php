<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate([
            'email' => 'koushik@gmail.com',
        ], [
            'name' => 'koushik',
            'password' => Hash::make('12345678'),
        ]);

        User::updateOrCreate([
            'email' => 'papon@gmail.com',
        ], [
            'name' => 'papon',
            'password' => Hash::make('12345678'),
        ]);

        User::updateOrCreate([
            'email' => 'rahat@gmail.com',
        ], [
            'name' => 'rahat',
            'password' => Hash::make('12345678'),
        ]);
    }
}
