<?php

namespace App\Exceptions;

use Exception;

class OtpThrottleException extends Exception
{
    public function __construct(public readonly int $retryAfter)
    {
        parent::__construct("Please wait {$retryAfter} seconds before requesting another code.");
    }
}
