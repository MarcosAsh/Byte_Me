package com.byteme.app;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryRepository categoryRepo;

    @InjectMocks
    private CategoryController categoryController;

    @Test
    void testGetAll() {
        
        List<Category> mockList = Arrays.asList(new Category(), new Category());
        when(categoryRepo.findAll()).thenReturn(mockList);

        
        List<Category> result = categoryController.getAll();

        
        assertEquals(2, result.size());
    }
}