import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import { prisma } from "../server";
import fs from "fs";
import { Prisma } from "@prisma/client";

//create a product
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
    } = req.body;


    //check if images are uploaded and not empty
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
       res.status(400).json({ success: false, message: "No images uploaded" });
       return
    }

    //store the uploaded files
    const files = req.files as Express.Multer.File[];

    //upload all images to cloudinary
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "ecommerce",
      })
    );


    //wait for all images to be uploaded
    const uploadresults = await Promise.all(uploadPromises);

    //extract the image urls
    const imageUrls = uploadresults.map((result) => result.secure_url);

    const newlyCreatedProduct = await prisma.product.create({
      data: {
        name,
        brand,
        category,
        description,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","),
        price: parseFloat(price),
        stock: parseInt(stock),
        images: imageUrls,
        soldCount: 0,
        rating: 0,
      },
    });

    console.log("newly created product", newlyCreatedProduct);
    
    // Safely delete uploaded files
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      } else {
        console.warn(`File not found: ${file.path}`);
      }
    });
    res.status(201).json({
      success: true,
      message: "Product created",
      data: newlyCreatedProduct
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: `internal server error ${e}` });
  }
};

//fetch all products (admin side)
export const fetchAllProductsForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fetchAllProducts = await prisma.product.findMany();
    res.status(200).json(fetchAllProducts)
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

//get a single product
export const getProductByID = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//update  a product (admin)
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
      rating
    } = req.body;

    const files = req.files as Express.Multer.File[]; // Get uploaded files

    // Initialize new image URLs
    let newImageUrls: string[] = [];


     // Fetch existing product
     const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });


    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found!" });
      return;
    }


     // Upload new images to Cloudinary if provided
     if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "ecommerce" })
      );

      const uploadResults = await Promise.all(uploadPromises);
      newImageUrls = uploadResults.map((result) => result.secure_url);


       // Optional: Delete old images from Cloudinary
       if (existingProduct.images.length > 0) {
        const deletePromises = existingProduct.images.map((url) => {
          const publicId = url.split("/").pop()?.split(".")[0]; // Extract publicId from URL
          return cloudinary.uploader.destroy(`ecommerce/${publicId}`);
        });

        await Promise.all(deletePromises);
      }
    } else {
      // If no new images are uploaded, retain the old images
      newImageUrls = existingProduct.images;
    }


    //homework -> you can also implement image update func
    //I will do it in the 1hr mark

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        category,
        description,
        gender,
        images: newImageUrls,
        sizes: sizes.split(","),
        colors: colors.split(","),
        price: parseFloat(price),
        stock: parseInt(stock),
        rating: parseInt(rating),
      },
    });

    res.status(200).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//delete a product (admin)
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });

    res
      .status(200)
      .json({ success: true, message: "Product deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//fetch products with filter (client)

export const getProductsForClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = ((req.query.categories as string) || "")
      .split(",")
      .filter(Boolean);
    const brands = ((req.query.brands as string) || "")
      .split(",")
      .filter(Boolean);
    const sizes = ((req.query.sizes as string) || "")
      .split(",")
      .filter(Boolean);
    const colors = ((req.query.colors as string) || "")
      .split(",")
      .filter(Boolean);

    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice =
      parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const skip = (page - 1) * limit;

    const where: Prisma.productWhereInput = {
      AND: [
        categories.length > 0
          ? {
              category: {
                in: categories,
                mode: "insensitive",
              },
            }
          : {},
        brands.length > 0
          ? {
              brand: {
                in: brands,
                mode: "insensitive",
              },
            }
          : {},
        sizes.length > 0
          ? {
              sizes: {
                hasSome: sizes,
              },
            }
          : {},
        colors.length > 0
          ? {
              colors: {
                hasSome: colors,
              },
            }
          : {},
        {
          price: { gte: minPrice, lte: maxPrice },
        },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    console.log(
      Math.ceil(total / limit),
      total,
      limit,
      "Math.ceil(total / limit)"
    );

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
