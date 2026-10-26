package internal

import (
	"context"
	"database/sql"
	"errors"

	"github.com/go-sql-driver/mysql"
	"tools/internal/modules/auth/internal"
	"tools/internal/modules/auth/internal/sqlc"
)

type Service struct {
	q sqlc.Querier
}

func New(db *sql.DB) *Service {
	return &Service{
		q: sqlc.New(db),
	}
}

func (s *Service) Register(
	ctx context.Context,
	arg internal.CreateUserDTO) error {
	hash, err := Hash(arg.Password)
	if err != nil {
		return err
	}
	arg.Password = hash
	_, err = s.q.CreateUser(ctx, internal.MapCreateUser(arg))
	var dbErr *mysql.MySQLError
	if errors.As(err, &dbErr) && dbErr.Number == 1062 {
		return internal.ErrEmailExists
	}
	return err
}

func (s *Service) Login(
	ctx context.Context,
	arg internal.LoginDTO) (
	internal.LoginResponseDTO, error,
) {
	user, err := s.q.GetUserByEmail(ctx, arg.Email)

	if errors.Is(err, sql.ErrNoRows) {
		return internal.LoginResponseDTO{}, internal.ErrInvalidCredentials
	}
	if err != nil {
		return internal.LoginResponseDTO{}, err
	}

	if !Matches(arg.Password, user.PasswordHash) {
		return internal.LoginResponseDTO{}, internal.ErrInvalidCredentials
	}

	return internal.MapGetUser(user), nil

}

func (s *Service) Me(ctx context.Context, id uint64) (internal.UserDTO, error) {
	user, err := s.q.GetUserByID(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return internal.UserDTO{}, internal.ErrUserNotFound
	}
	if err != nil {
		return internal.UserDTO{}, err
	}
	return internal.UserDTO{ID: user.ID, Name: user.Name, Email: user.Email, Phone: user.Phone, Role: internal.Role(user.Role), CreatedAt: user.CreatedAt}, nil
}
