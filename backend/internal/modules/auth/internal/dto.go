package internal

import "time"

type CreateUserDTO struct {
	Name     string `json:"name" binding:"required,min=2,max=150"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Phone    string `json:"phone" binding:"required,min=7,max=20"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type LoginDTO struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type LoginResponseDTO struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Role Role   `json:"role"`
}

// UserDTO contains only public profile fields.
type UserDTO struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type TokenResponseDTO struct {
	Token string           `json:"token"`
	User  LoginResponseDTO `json:"user"`
}
