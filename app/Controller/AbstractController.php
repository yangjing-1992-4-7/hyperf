<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
namespace App\Controller;

use Hyperf\Di\Annotation\Inject;
use Hyperf\View\RenderInterface;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Container\ContainerInterface;
use Hyperf\Contract\SessionInterface;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;
use Hyperf\DbConnection\Db;

abstract class AbstractController
{
    /**
     * @Inject
     * @var ContainerInterface
     */
    protected $container;

    /**
     * @Inject
     * @var RequestInterface
     */
    protected $request;

    /**
     * @Inject
     * @var ResponseInterface
     */
    protected $response;
    
    
    /**
     * @Inject
     * @var RenderInterface
     */
    protected $render;
    
    /**
     * @Inject
     * @var SessionInterface
     */
    protected $session;
    
    /**
     * @Inject
     * @var ValidatorFactoryInterface
     */
    protected $validationFactory;
    
    
}
