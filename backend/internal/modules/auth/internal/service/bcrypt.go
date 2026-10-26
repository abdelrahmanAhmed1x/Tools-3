package internal

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const (
	MinLength = 8
	MaxLength = 72
)

func Hash(value string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(value), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hashed), nil
}

func Matches(value, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(value)) == nil
}
