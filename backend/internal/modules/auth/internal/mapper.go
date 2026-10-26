package internal

import "tools/internal/modules/auth/internal/sqlc"

func MapGetUser(arg sqlc.GetUserByEmailRow) LoginResponseDTO {

	return LoginResponseDTO{
		ID:   int(arg.ID),
		Name: arg.Name,
		Role: Role(arg.Role),
	}
}

// make sure to first hash the password in the dto before calling the function
func MapCreateUser(arg CreateUserDTO) sqlc.CreateUserParams {
	return sqlc.CreateUserParams{
		Name:         arg.Name,
		Email:        arg.Email,
		Phone:        arg.Phone,
		PasswordHash: arg.Password,
	}
}
